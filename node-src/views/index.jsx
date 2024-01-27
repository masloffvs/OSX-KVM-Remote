var React = require('react');
const DefaultLayout = require('./layouts/default.jsx')

function Index(props) {
	return <DefaultLayout title={props.title}>
		<h1 style={{marginTop: 0}}>
			Welcome to the OpenCore Hypervisor
		</h1>
		<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab architecto doloremque error fugit illo minima obcaecati totam. Ad amet ea eaque eum exercitationem expedita fugiat id, impedit incidunt ipsa iste labore minus molestias nam nesciunt nobis nulla odit perspiciatis qui, quibusdam quos, reiciendis saepe sed ullam vel vitae voluptatem! Architecto asperiores deleniti, deserunt ducimus eos eveniet, facilis fugiat hic illo illum laudantium nobis nulla officia provident quae quam quas reiciendis sed sit, sunt tempore ut vitae. Amet blanditiis dolores ea earum facilis, fugit impedit incidunt, odio repellendus soluta velit vitae.</p>

		<table className="table table-bordered table-hover" style={{width: '100%', textAlign: 'left'}}>
			<thead>
			<tr>
				<th>Name</th>
				<th>Image</th>
				<th>RAM</th>
				<th>GPU (Cores)</th>
			</tr>
			</thead>
			<tbody>
				{
					props.vms.map(vm => {
						return <tr>
							<td>{vm.name}</td>
							{/*<td><pre>{JSON.stringify(vm.vm.proc.options, null, 2)}</pre></td>*/}
							<td>{vm.vm.proc.options.allocatedRam}</td>
							<td>{vm.vm.proc.options.allocatedRam} MiB</td>
							<td>{vm.vm.proc.options.cpuCores} cores</td>
						</tr>
					})
				}
			</tbody>
		</table>

		<hr/>
	</DefaultLayout>;
}

module.exports = Index;